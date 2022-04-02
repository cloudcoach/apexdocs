import { ConstructorMirror, DocComment, MethodMirror } from '@cparra/apex-reflection';
import { MarkdownFile } from '../markdown-file';
import { ParameterMirror } from '@cparra/apex-reflection/index';
import { addCustomDocCommentAnnotations } from './doc-comment-annotation-util';

export function declareMethod(
  markdownFile: MarkdownFile,
  methods: ConstructorMirror[] | MethodMirror[],
  startingHeadingLevel: number,
  className = '',
): void {
  methods.forEach((currentMethod) => {
    const signatureName = isMethod(currentMethod) ? (currentMethod as MethodMirror).name : className;
    markdownFile.addTitle(`\`${buildSignature(signatureName, currentMethod)}\``, startingHeadingLevel + 2);
    currentMethod.annotations.forEach((annotation) => {
      markdownFile.addBlankLine();
      markdownFile.addText(`\`${annotation.type.toUpperCase()}\``);
    });

    if (currentMethod.docComment?.description) {
      markdownFile.addBlankLine();
      markdownFile.addText(currentMethod.docComment.description);
      markdownFile.addBlankLine();
    }

    if (currentMethod.parameters.length) {
      addParameters(markdownFile, currentMethod, startingHeadingLevel);
    }

    if (isMethod(currentMethod)) {
      addReturns(markdownFile, currentMethod as MethodMirror, startingHeadingLevel);
    }

    addThrowsBlock(markdownFile, currentMethod, startingHeadingLevel);

    addCustomDocCommentAnnotations(markdownFile, currentMethod);

    if (currentMethod.docComment?.exampleAnnotation) {
      addExample(markdownFile, currentMethod, startingHeadingLevel);
    }
  });

  markdownFile.addHorizontalRule();
}

type ParameterAware = {
  parameters: ParameterMirror[];
};

type DocCommentAware = {
  docComment?: DocComment;
};

function buildSignature(name: string, parameterAware: ParameterAware): string {
  let signature = `${name}(`;
  if (isMethod(parameterAware) && (parameterAware as MethodMirror).memberModifiers.length) {
    signature = (parameterAware as MethodMirror).memberModifiers.join(' ') + ' ' + signature;
  }
  const signatureParameters = parameterAware.parameters.map((param) => `${param.type} ${param.name}`);
  signature += signatureParameters.join(', ');
  return (signature += ')');
}

function addParameters(
  markdownFile: MarkdownFile,
  methodModel: MethodMirror | ConstructorMirror,
  startingHeadingLevel: number,
) {
  markdownFile.addTitle('Parameters', startingHeadingLevel + 3);
  markdownFile.initializeTable('Param', 'Description');

  methodModel.docComment?.paramAnnotations.forEach((paramAnnotation) => {
    const paramName = paramAnnotation.paramName;
    const paramDescription = paramAnnotation.bodyLines.join(' ');
    markdownFile.addTableRow(`\`${paramName}\``, paramDescription);
  });

  markdownFile.addBlankLine();
}

function addReturns(markdownFile: MarkdownFile, methodModel: MethodMirror, startingHeadingLevel: number) {
  if (!methodModel.docComment?.returnAnnotation) {
    return;
  }

  markdownFile.addTitle('Return', startingHeadingLevel + 3);
  markdownFile.addBlankLine();
  markdownFile.addText('**Type**');
  markdownFile.addBlankLine();
  markdownFile.addText(methodModel.type);
  markdownFile.addBlankLine();
  markdownFile.addText('**Description**');
  markdownFile.addBlankLine();
  markdownFile.addText(methodModel.docComment?.returnAnnotation.bodyLines.join(' '));
  markdownFile.addBlankLine();
}

function addThrowsBlock(markdownFile: MarkdownFile, docCommentAware: DocCommentAware, startingHeadingLevel: number) {
  if (!docCommentAware.docComment?.throwsAnnotations.length) {
    return;
  }
  markdownFile.addTitle('Throws', startingHeadingLevel + 3);
  markdownFile.initializeTable('Exception', 'Description');

  docCommentAware.docComment?.throwsAnnotations.forEach((annotation) => {
    const exceptionName = annotation.exceptionName;
    const exceptionDescription = annotation.bodyLines.join(' ');

    markdownFile.addTableRow(`\`${exceptionName}\``, exceptionDescription);
  });

  markdownFile.addBlankLine();
}

function addExample(markdownFile: MarkdownFile, docCommentAware: DocCommentAware, startingHeadingLevel: number) {
  markdownFile.addTitle('Example', startingHeadingLevel + 3);
  markdownFile.startCodeBlock();
  docCommentAware.docComment?.exampleAnnotation.bodyLines.forEach((line) => {
    markdownFile.addText(line, false);
  });
  markdownFile.endCodeBlock();
  markdownFile.addBlankLine();
}

function isMethod(method: MethodMirror | ConstructorMirror | ParameterAware): method is ConstructorMirror {
  return (method as MethodMirror).type !== undefined;
}